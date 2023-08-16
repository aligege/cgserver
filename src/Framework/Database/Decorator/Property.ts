export class EPropertyType
{
    public static Char="char";
    public static NVarchar="nvarchar";
    public static Varchar="varchar";

    public static BigInt="bigint";
    public static Decimal="decimal";
    public static Double="double";
    public static Float="float";
    public static Int="int";
    public static MediumInt="Mediumint";
    public static Real="real";
    public static SmallInt="smallint";
    public static TinyInt="tinyint";
    
    public static LongText="longtext";
    public static MediumText="mediumtext";
    public static Text="text";
    public static TinyText="tinytext";

    public static defs=
    {
        "char":"",
        "nvarchar":"",
        "varchar":"",

        "bigint":0,
        "decimal":0,
        "double":0,
        "float":0,
        "int":0,
        "Mediumint":0,
        "real":0,
        "smallint":0,
        "tinyint":0,
    
        "longtext":"",
        "mediumtext":"",
        "text":undefined,
        "tinytext":""
    }
}
export class Property
{
    public is_primary:boolean=false
    public is_notnull:boolean=false
    public auto_increment:boolean=false
    public auto_start:number=1//包含
    public type:string=EPropertyType.Varchar
    public type_len:number=45
    public default:any=null
}
export class TableProperty
{
    public static key="___table___"
    public table:string=null
    public version:number=1
    public engine:string="InnoDB"
    public auto_increment:number=null
    public charset:string="utf8mb4"
    public comment:string=null
    public items:{[name:string]:Property}={}
}